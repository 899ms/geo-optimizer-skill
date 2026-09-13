# LLM Providers for `geo citations`

`geo citations` asks a real AI answer engine the questions your customers ask, then checks
whether your brand is mentioned and your domain is cited as a source. It needs an API key for
whichever provider you want to query. This page covers provider-specific setup that doesn't fit
in the [README Quick Start](../README.md#quick-start): wire formats, regional endpoints, and
model capabilities.

Perplexity is the recommended default (`PERPLEXITY_API_KEY`) because Perplexity Sonar returns
real web citation URLs, not just parametric knowledge. OpenAI, Anthropic, and Groq reveal what
the model already knows about your brand from training data, which is a different (and weaker)
signal — see the README's [Additional tools](../README.md#additional-tools) section for the
distinction.

---

## MiniMax

MiniMax supports either wire format (OpenAI-compatible or Anthropic-compatible) and both a
global and a China API root:

```bash
export MINIMAX_API_KEY="your-api-key"
export MINIMAX_API_FORMAT="openai"  # or "anthropic"
export MINIMAX_API_BASE_URL="https://api.minimax.io/v1"
geo citations --provider minimax --brand "YourBrand" --domain yoursite.com
```

For the China endpoint, use `https://api.minimaxi.com/v1` with the `openai` format, or
`https://api.minimaxi.com/anthropic` with the `anthropic` format. The global messages-format root
is `https://api.minimax.io/anthropic`. `MINIMAX_THINKING` accepts `adaptive` or `disabled` for
`MiniMax-M3`; `MiniMax-M2.7` always uses thinking.

Set `GEO_LLM_MODEL` to select either supported model:

| Model | Context window | API input modalities | Thinking |
|-------|----------------|----------------------|----------|
| `MiniMax-M3` | 1,000,000 tokens | Text, image, video | `adaptive` or `disabled` |
| `MiniMax-M2.7` | 204,800 tokens | Text | Always on |

`geo citations` currently sends text prompts only. The modalities column lists what each model's
API accepts; `query_llm` currently types text and image content parts, so video input needs a
schema addition before it can be passed. See the
[official MiniMax pricing page](https://platform.minimax.io/docs/pricing/overview) for current
rates.

---

## Gemini

Gemini is checked directly against the Gemini API, not just simulated via crawler user-agents:

```bash
export GEMINI_API_KEY="your-api-key"
geo citations --provider gemini --brand "YourBrand" --domain yoursite.com
```

Set `GEO_LLM_MODEL` to pick a specific model (default: `gemini-3.7-flash`). This calls
`generativelanguage.googleapis.com` directly, not Vertex AI, so no extra dependency is needed.

---

## DeepSeek

DeepSeek covers citation checks against the Chinese AI answer-engine ecosystem, which
Western-only providers miss entirely:

```bash
export DEEPSEEK_API_KEY="your-api-key"
geo citations --provider deepseek --brand "YourBrand" --domain yoursite.com
```

Fully OpenAI-compatible wire format against `api.deepseek.com`. Default model
`deepseek-v4-flash`; set `GEO_LLM_MODEL=deepseek-v4-pro` for the higher-capability tier.
