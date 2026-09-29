"""Local CMS: python3 server.py --port 4175 (no third-party dependencies)."""
import argparse, base64, hashlib, json, os, secrets, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / 'data/content.json'
LOCK = threading.Lock()
TOKEN = secrets.token_urlsafe(32)
GROUPS = ('products', 'menu', 'events')
FIELDS = {'id','title','description','price','image','visible','category','sizes','colors','url','date','weekday','time','place','dj','registration','eventStatus'}

def validate(data):
    if not isinstance(data, dict) or set(data) != {'revision', *GROUPS}: raise ValueError('Неверный формат данных')
    if type(data['revision']) is not int: raise ValueError('Неверная версия данных')
    for group in GROUPS:
        rows = data[group]
        if not isinstance(rows,list) or len(rows)>300: raise ValueError('Не более 300 карточек в разделе')
        ids = set()
        for row in rows:
            if not isinstance(row,dict) or set(row)-FIELDS: raise ValueError('Неизвестные поля карточки')
            if type(row.get('visible')) is not bool: raise ValueError('Нужен статус карточки')
            for key,value in row.items():
                if key != 'visible' and (not isinstance(value,str) or len(value)>4000): raise ValueError('Слишком длинное значение')
            if not row.get('id') or row['id'] in ids or len(row['id'])>100: raise ValueError('Неверный ID карточки')
            ids.add(row['id'])
            if not row.get('title','').strip() or len(row['title'])>160: raise ValueError('Название: от 1 до 160 символов')
            img = row.get('image','')
            if not img.startswith('assets/') or '..' in img or not (ROOT/img).is_file(): raise ValueError('Выберите изображение карточки')
            if row.get('url') and urlsplit(row['url']).scheme not in ('http','https'): raise ValueError('Ссылка должна начинаться с https://')
            if group=='menu' and row.get('category') not in ('coffee','drinks','food'): raise ValueError('Выберите категорию меню')
            if group=='events' and row.get('eventStatus','planned') not in ('past','current','planned'):raise ValueError('Выберите статус события')
            if row.get('colors'):
                import re
                if any(not re.fullmatch(r'#[0-9a-fA-F]{6}',x.strip()) for x in row['colors'].split(',')): raise ValueError('Цвета: HEX через запятую, например #4248ff')
    return data

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def allowed_host(self):
        return self.headers.get('Host') in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')
    def reply(self,code,payload):
        body=json.dumps(payload,ensure_ascii=False).encode();self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def end_headers(self):
        self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY');super().end_headers()
    def do_GET(self):
        if not self.allowed_host():return self.reply(403,{'error':'Только локальный доступ'})
        path=unquote(urlsplit(self.path).path)
        if path=='/api/content':
            with LOCK: data=json.loads(CONTENT.read_text())
            return self.reply(200,{'content':data,'token':TOKEN})
        if path=='/api/assets':
            files=sorted(str(p.relative_to(ROOT)) for p in (ROOT/'assets').rglob('*') if p.suffix.lower() in ('.webp','.png','.jpg','.jpeg','.gif') and p.is_file())
            return self.reply(200,files)
        target=(ROOT/path.lstrip('/')).resolve()
        if not target.is_relative_to(ROOT):return self.reply(404,{'error':'Не найдено'})
        rel=target.relative_to(ROOT)
        public=(not rel.parts or path=='/') or (len(rel.parts)==1 and target.suffix in ('.html','.css','.js')) or (rel.parts and rel.parts[0] in ('assets','admin')) or path=='/data/content.json'
        if not public or any(part.startswith('.') for part in rel.parts):return self.reply(404,{'error':'Не найдено'})
        if target.is_dir() and not (target/'index.html').is_file():return self.reply(404,{'error':'Не найдено'})
        return super().do_GET()
    def do_HEAD(self):
        # Only GET is needed for the editor; never expose private paths via HEAD.
        return self.reply(405,{'error':'Используйте GET'})
    def do_POST(self):
        origin=self.headers.get('Origin')
        if not self.allowed_host() or origin not in (f'http://127.0.0.1:{self.server.server_port}',f'http://localhost:{self.server.server_port}') or not secrets.compare_digest(self.headers.get('X-Admin-Token',''),TOKEN):return self.reply(403,{'error':'Обновите страницу админки'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<15_000_000:raise ValueError('Файл слишком большой (максимум 8 МБ)')
            payload=json.loads(self.rfile.read(length))
            if self.path=='/api/content':
                validate(payload)
                with LOCK:
                    current=json.loads(CONTENT.read_text())
                    if payload['revision']!=current['revision']:return self.reply(409,{'error':'Данные изменились в другой вкладке. Перезагрузите список перед сохранением.'})
                    backup=ROOT/'.admin-backups';backup.mkdir(exist_ok=True)
                    (backup/f'{current["revision"]}.json').write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
                    payload['revision']+=1
                    temporary=CONTENT.with_suffix('.tmp');temporary.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n');os.replace(temporary,CONTENT)
                return self.reply(200,{'content':payload})
            if self.path=='/api/upload':
                if not isinstance(payload,dict) or not isinstance(payload.get('data'),str):raise ValueError('Неверный формат изображения')
                raw=base64.b64decode(payload['data'],validate=True)
                if len(raw)>8_000_000:raise ValueError('Изображение должно быть меньше 8 МБ')
                ext=('.png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else '.jpg' if raw.startswith(b'\xff\xd8\xff') else '.webp' if raw.startswith(b'RIFF') and raw[8:12]==b'WEBP' else '.gif' if raw[:6] in (b'GIF87a',b'GIF89a') else None)
                if not ext:raise ValueError('Поддерживаются JPG, PNG, WebP и GIF')
                folder=ROOT/'assets/uploads';folder.mkdir(exist_ok=True)
                target=folder/(hashlib.sha256(raw).hexdigest()[:24]+ext);target.write_bytes(raw)
                return self.reply(200,{'image':str(target.relative_to(ROOT))})
            return self.reply(404,{'error':'Не найдено'})
        except (ValueError,TypeError,KeyError) as error:return self.reply(400,{'error':str(error)})
        except OSError:return self.reply(500,{'error':'Не удалось записать данные на диск'})

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4175);args=parser.parse_args()
    print(f'Сайт: http://127.0.0.1:{args.port}/\nАдминка: http://127.0.0.1:{args.port}/admin/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
