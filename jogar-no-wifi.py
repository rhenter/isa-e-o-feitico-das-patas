"""Serve somente os arquivos deste jogo na rede local; não publica na internet."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import socket
root=Path(__file__).resolve().parent/'jogo'
port=8000
try:
 server=ThreadingHTTPServer(('0.0.0.0',port),partial(SimpleHTTPRequestHandler,directory=str(root)))
except OSError as e:
 print('Não foi possível abrir a porta 8000. Feche uma janela anterior deste jogo e tente novamente.');input('Enter para sair.');raise SystemExit(1)
print('\nISA & PAPAI — JOGO PARA IPHONE\n')
print('No computador: http://localhost:8000')
try:
 ips=sorted(set(socket.gethostbyname_ex(socket.gethostname())[2]))
except OSError: ips=[]
for ip in ips:
 if not ip.startswith('127.'):
  print('No Safari do iPhone, no mesmo Wi-Fi: http://'+ip+':8000')
print('\nSe nenhum endereço do Wi-Fi aparecer, use o IPv4 do computador seguido de :8000.')
print('Mantenha esta janela aberta enquanto joga. Ctrl+C para encerrar.\n')
try: server.serve_forever()
except KeyboardInterrupt: pass
finally: server.server_close()
