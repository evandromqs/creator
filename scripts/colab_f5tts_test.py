import subprocess
import sys
import time

subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "f5-tts"])

t0 = time.time()
cmd = [
    "f5-tts_infer-cli",
    "--model", "F5TTS_v1_Base",
    "--ref_audio", "/content/ref.wav",
    "--ref_text", "Olá! Esse é um teste de narração neural em português rodando direto na placa L4 do Google Colab.",
    "--gen_text", "Davi olhou para o gigante Golias e disse: você vem contra mim com espada e lança, mas eu vou em nome do Senhor.",
    "--output_dir", "/content",
    "--output_file", "f5tts-test.wav",
]
subprocess.check_call(cmd)
print(f"F5-TTS gerado em {time.time() - t0:.1f}s -> /content/f5tts-test.wav")
