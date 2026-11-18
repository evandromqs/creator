import os
import subprocess
import sys
import time

subprocess.check_call([
    sys.executable, "-m", "pip", "install", "-q",
    "diffusers", "transformers", "accelerate", "sentencepiece", "protobuf"
])

import torch
from diffusers import FluxPipeline

t0 = time.time()
pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-schnell",
    torch_dtype=torch.bfloat16,
    token=os.environ.get("HF_TOKEN")
)
pipe.enable_sequential_cpu_offload()
print(f"Modelo carregado em {time.time() - t0:.1f}s")

t1 = time.time()
img = pipe(
    prompt="young shepherd boy David holding a wooden staff and leather sling in a sunlit ancient Judean valley, biblical epic cinematic lighting, photorealistic, 8k, vertical 9:16",
    width=768,
    height=1344,
    num_inference_steps=4,
    guidance_scale=0.0,
).images[0]
img.save("/content/davi-flux-1.png")
print(f"Imagem gerada em {time.time() - t1:.1f}s -> /content/davi-flux-1.png")
