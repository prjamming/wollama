import { Wllama } from "@wllama/wllama/esm/wllama";
import { Template } from "@huggingface/jinja";

import wllamaSingleJS from "@wllama/wllama/src/single-thread/wllama.js?url";
import wllamaSingle from "@wllama/wllama/src/single-thread/wllama.wasm?url";

const CHAT_TEMPLATE =
  "{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}";

const isLocalHost = ["localhost", "0.0.0.0", "127.0.0.1"].includes(window.location.hostname);

export const PRESET_MODELS = {
  // https://huggingface.co/QuantFactory/SmolLM-135M-Instruct-GGUF
  "SmolLm (135M)": {
    name: "SmolLm (135M)",
    url: isLocalHost
      ? "/models/smollm-135m-instruct_q8_0.gguf"
      : "https://huggingface.co/QuantFactory/SmolLM-135M-Instruct-GGUF/resolve/main/SmolLM-135M-Instruct.Q4_K_M.gguf",
    license: "https://huggingface.co/datasets/choosealicense/licenses/blob/main/markdown/apache-2.0.md",
    description: "Less accurate but faster than the 360M version",
  },
  // "https://huggingface.co/neopolita/smollm-360m-instruct-gguf"
  "SmolLm (360M)": {
    name: "SmolLm (360M)",
    url: "https://huggingface.co/neopolita/smollm-360m-instruct-gguf/resolve/main/smollm-360m-instruct_q4_k_m.gguf",
    license: "https://huggingface.co/datasets/choosealicense/licenses/blob/main/markdown/apache-2.0.md",
    description: "Higher quality and more accurate than the 135M version",
  },
  // https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q4_K_M-GGUF
  "Llama 3.2 (1B)": {
    name: "Llama 3.2 (1B)",
    url: "https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-1b-instruct-q4_k_m.gguf",
    license: "https://raw.githubusercontent.com/meta-llama/llama-models/refs/heads/main/models/llama3_2/LICENSE",
    description: "The 1B version of The Meta Llama 3.2 collection.",
  },
};

export const formatChat = async (wllamaInstance, messages) => {
  const template = new Template(wllamaInstance.getChatTemplate() ?? CHAT_TEMPLATE);
  return template.render({
    messages,
    bos_token: await wllamaInstance.detokenize([wllamaInstance.getBOS()]),
    eos_token: await wllamaInstance.detokenize([wllamaInstance.getEOS()]),
    add_generation_prompt: true,
  });
};

export const getWllamaInstance = () => new Wllama({
  "single-thread/wllama.js": wllamaSingleJS,
  "single-thread/wllama.wasm": wllamaSingle,
});
