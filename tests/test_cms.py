import base64
import io
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import server

class LocalCMS(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        (self.root/'assets').mkdir(); (self.root/'assets/test.webp').write_bytes(b'RIFF0000WEBP')
        (self.root/'data').mkdir()
        self.content=self.root/'data/content.json'
        self.seed={'revision':1,'products':[],'menu':[],'events':[]}
        self.content.write_text(json.dumps(self.seed))
        self.patches=[patch.object(server,'ROOT',self.root),patch.object(server,'CONTENT',self.content)]
        for p in self.patches:p.start()
    def tearDown(self):
        for p in self.patches:p.stop()
        self.temp.cleanup()
    def post(self,path,payload,token=None,origin=None):
        raw=json.dumps(payload).encode()
        handler=object.__new__(server.Handler)
        handler.server=SimpleNamespace(server_port=4175)
        handler.headers={'Host':'127.0.0.1:4175','Origin':origin or 'http://127.0.0.1:4175','X-Admin-Token':server.TOKEN if token is None else token,'Content-Length':str(len(raw))}
        handler.path=path;handler.rfile=io.BytesIO(raw)
        result=[];handler.reply=lambda code,data:result.append((code,data))
        handler.do_POST()
        return result[0]
    def row(self,id='test'):
        return dict(id=id,title='Test',image='assets/test.webp',visible=True,price='£4',category='coffee')
    def test_crud_all_sections_and_backup(self):
        current=self.seed
        for group in server.GROUPS:
            current[group]=[self.row()]
            code,result=self.post('/api/content',current);self.assertEqual(code,200)
            current=result['content'];self.assertEqual(json.loads(self.content.read_text()),current)
            current[group][0]['visible']=False
            code,result=self.post('/api/content',current);self.assertEqual(code,200);current=result['content']
            current[group]=[]
            code,result=self.post('/api/content',current);self.assertEqual(code,200);current=result['content']
        self.assertEqual(len(list((self.root/'.admin-backups').glob('*.json'))),9)
        self.assertEqual(current['revision'],10)
    def test_conflicting_save(self):
        self.assertEqual(self.post('/api/content',self.seed)[0],200)
        self.assertEqual(self.post('/api/content',self.seed)[0],409)
    def test_auth_and_cross_origin(self):
        self.assertEqual(self.post('/api/content',self.seed,token='bad')[0],403)
        self.assertEqual(self.post('/api/content',self.seed,origin='https://evil.example')[0],403)
    def test_validation(self):
        for update in ({'image':'../server.py'},{'title':''},{'url':'javascript:alert(1)'},{'colors':'red'},{'visible':'true'}):
            row=self.row();row.update(update);data=dict(self.seed,products=[row])
            self.assertEqual(self.post('/api/content',data)[0],400)
        self.assertEqual(json.loads(self.content.read_text())['revision'],1)
    def test_event_status(self):
        for status in ('past','current','planned'):
            data=json.loads(self.content.read_text());data['events']=[dict(self.row(),eventStatus=status)]
            self.assertEqual(self.post('/api/content',data)[0],200)
        data=json.loads(self.content.read_text());data['events'][0]['eventStatus']='invalid'
        self.assertEqual(self.post('/api/content',data)[0],400)
    def test_upload(self):
        raw=b'RIFF0000WEBPtest'
        code,result=self.post('/api/upload',{'data':base64.b64encode(raw).decode()})
        self.assertEqual(code,200);self.assertEqual((self.root/result['image']).read_bytes(),raw)
        for payload in ([],{}, {'data':'!'}, {'data':base64.b64encode(b'<script>').decode()}):
            self.assertEqual(self.post('/api/upload',payload)[0],400)

if __name__=='__main__':unittest.main()
