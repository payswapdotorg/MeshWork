import type { ApiFormat } from "./types";

/**
 * Model provider template catalog (zcode Settings → Model settings → Add provider).
 *
 * Templates describe the *starter* configuration a new provider row is created
 * from. Base URLs and starter model entries follow the zcode catalog; the
 * preview build never contacts these endpoints — testing is simulated in the UI.
 */

export interface ProviderTemplateModel {
  modelId: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputTypes?: string[];
  capabilities?: Record<string, boolean>;
  reasoningLevels?: string[];
}

export interface ProviderTemplate {
  key: string;
  name: string;
  /** Empty for the custom provider template. */
  baseUrl: string;
  apiFormat: ApiFormat;
  logoKey: string;
  /** Plan/OAuth-backed provider — endpoint fields are locked after creation. */
  account?: boolean;
  /** Provider console (opened by the desktop build, toast in this preview). */
  consoleUrl?: string;
  /** The "Create custom provider" tile renders a Plus tile instead of a logo. */
  custom?: boolean;
  models: ProviderTemplateModel[];
}

const GLM_MAX: ProviderTemplateModel = {
  modelId: "glm-5.3-max",
  contextWindow: 1_000_000,
  maxOutputTokens: 32_768,
  inputTypes: ["text", "image", "pdf"],
  capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
  reasoningLevels: ["low", "medium", "high"],
};

const GLM_FLASH: ProviderTemplateModel = {
  modelId: "glm-5.3-flash",
  contextWindow: 200_000,
  maxOutputTokens: 16_384,
  inputTypes: ["text", "image"],
  capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
  reasoningLevels: ["low", "medium", "high"],
};

export const PROVIDER_TEMPLATE_GROUPS: { label: string; templates: ProviderTemplate[] }[] = [
  {
    label: "Zhipu",
    templates: [
      {
        key: "zai-coding-plan",
        name: "Z.ai Coding Plan",
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
        apiFormat: "anthropic-messages",
        logoKey: "zai",
        account: true,
        consoleUrl: "https://z.ai/manage/coding",
        models: [GLM_MAX, GLM_FLASH],
      },
      {
        key: "zai-api",
        name: "Z.ai API",
        baseUrl: "https://api.z.ai/api/paas/v4",
        apiFormat: "openai-chat-completions",
        logoKey: "zai",
        consoleUrl: "https://z.ai/manage/apikey",
        models: [GLM_MAX, GLM_FLASH],
      },
      {
        key: "bigmodel-coding-plan",
        name: "BigModel Coding Plan",
        baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
        apiFormat: "anthropic-messages",
        logoKey: "bigmodel",
        account: true,
        consoleUrl: "https://open.bigmodel.cn/usercenter/apikeys",
        models: [GLM_MAX],
      },
      {
        key: "bigmodel-api",
        name: "BigModel API",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        apiFormat: "openai-chat-completions",
        logoKey: "bigmodel",
        consoleUrl: "https://open.bigmodel.cn/usercenter/apikeys",
        models: [GLM_MAX, GLM_FLASH],
      },
    ],
  },
  {
    label: "Other",
    templates: [
      {
        key: "custom",
        name: "Create custom provider",
        baseUrl: "",
        apiFormat: "openai-chat-completions",
        logoKey: "custom",
        custom: true,
        models: [],
      },
      {
        key: "kimi",
        name: "Kimi",
        baseUrl: "https://api.moonshot.cn/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "kimi",
        consoleUrl: "https://platform.moonshot.cn/console/api-keys",
        models: [
          {
            modelId: "kimi-k2-0905-preview",
            contextWindow: 256_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "kimi-code",
        name: "Kimi Code",
        baseUrl: "https://api.moonshot.cn/anthropic",
        apiFormat: "anthropic-messages",
        logoKey: "kimi",
        consoleUrl: "https://platform.moonshot.cn/console/api-keys",
        models: [
          {
            modelId: "kimi-k2-thinking",
            contextWindow: 256_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "minimax",
        name: "MiniMax",
        baseUrl: "https://api.minimax.io/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "minimax",
        consoleUrl: "https://platform.minimax.io/console/keys",
        models: [
          {
            modelId: "MiniMax-M2",
            contextWindow: 204_800,
            maxOutputTokens: 32_768,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "deepseek",
        name: "DeepSeek",
        baseUrl: "https://api.deepseek.com",
        apiFormat: "openai-chat-completions",
        logoKey: "deepseek",
        consoleUrl: "https://platform.deepseek.com/api_keys",
        models: [
          {
            modelId: "deepseek-chat",
            contextWindow: 128_000,
            maxOutputTokens: 8_192,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
          },
          {
            modelId: "deepseek-reasoner",
            contextWindow: 128_000,
            maxOutputTokens: 8_192,
            inputTypes: ["text"],
            capabilities: { structuredOutput: false, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "alibaba-cloud",
        name: "Alibaba Cloud",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "alibaba",
        consoleUrl: "https://dashscope.console.aliyun.com/apiKey",
        models: [
          {
            modelId: "qwen3-max",
            contextWindow: 262_144,
            maxOutputTokens: 16_384,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
          {
            modelId: "qwen3-coder-plus",
            contextWindow: 262_144,
            maxOutputTokens: 16_384,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
          },
        ],
      },
      {
        key: "xiaomi-mimo",
        name: "Xiaomi MiMo",
        baseUrl: "https://api.xiaomimimo.com/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "mimo",
        consoleUrl: "https://xiaomimimo.com/console",
        models: [
          {
            modelId: "mimo-v2-flash",
            contextWindow: 128_000,
            maxOutputTokens: 8_192,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "tencent-tokenhub",
        name: "Tencent TokenHub",
        baseUrl: "https://api.tokenhub.tencent.com/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "tencent",
        consoleUrl: "https://console.cloud.tencent.com/tokenhub",
        models: [
          {
            modelId: "hunyuan-t1-vision",
            contextWindow: 256_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
          },
        ],
      },
      {
        key: "volcano-ark",
        name: "Volcano Ark",
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiFormat: "openai-chat-completions",
        logoKey: "volcano",
        consoleUrl: "https://console.volcengine.com/ark",
        models: [
          {
            modelId: "doubao-seed-1-6",
            contextWindow: 256_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "stepfun",
        name: "StepFun",
        baseUrl: "https://api.stepfun.com/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "stepfun",
        consoleUrl: "https://platform.stepfun.com/interface-key",
        models: [
          {
            modelId: "step-3",
            contextWindow: 256_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "openai",
        name: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        apiFormat: "openai-responses",
        logoKey: "openai",
        consoleUrl: "https://platform.openai.com/api-keys",
        models: [
          {
            modelId: "gpt-5.2",
            contextWindow: 400_000,
            maxOutputTokens: 128_000,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
          {
            modelId: "gpt-5.2-mini",
            contextWindow: 400_000,
            maxOutputTokens: 128_000,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
          },
        ],
      },
      {
        key: "anthropic",
        name: "Anthropic",
        baseUrl: "https://api.anthropic.com",
        apiFormat: "anthropic-messages",
        logoKey: "anthropic",
        consoleUrl: "https://console.anthropic.com/settings/keys",
        models: [
          {
            modelId: "claude-sonnet-4-5",
            contextWindow: 200_000,
            maxOutputTokens: 64_000,
            inputTypes: ["text", "image", "pdf"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
          {
            modelId: "claude-opus-4-5",
            contextWindow: 200_000,
            maxOutputTokens: 32_000,
            inputTypes: ["text", "image", "pdf"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "xai",
        name: "xAI",
        baseUrl: "https://api.x.ai/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "xai",
        consoleUrl: "https://console.x.ai",
        models: [
          {
            modelId: "grok-4.1",
            contextWindow: 256_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "siliconflow",
        name: "SiliconFlow",
        baseUrl: "https://api.siliconflow.cn/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "siliconflow",
        consoleUrl: "https://cloud.siliconflow.cn/account/ak",
        models: [
          {
            modelId: "deepseek-ai/DeepSeek-V3.2",
            contextWindow: 128_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
          },
          {
            modelId: "Qwen/Qwen3-235B-A22B",
            contextWindow: 128_000,
            maxOutputTokens: 16_384,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "openrouter",
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "openrouter",
        consoleUrl: "https://openrouter.ai/settings/keys",
        models: [
          {
            modelId: "anthropic/claude-sonnet-4.5",
            contextWindow: 200_000,
            maxOutputTokens: 64_000,
            inputTypes: ["text", "image", "pdf"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
          {
            modelId: "openai/gpt-5.2",
            contextWindow: 400_000,
            maxOutputTokens: 128_000,
            inputTypes: ["text", "image"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
          },
        ],
      },
      {
        key: "opencode-go",
        name: "OpenCode Go",
        baseUrl: "https://api.opencode.dev/go/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "opencode",
        consoleUrl: "https://opencode.dev/go",
        models: [
          {
            modelId: "go-1",
            contextWindow: 256_000,
            maxOutputTokens: 32_768,
            inputTypes: ["text"],
            capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
      {
        key: "opencode-zen",
        name: "OpenCode Zen",
        baseUrl: "https://api.opencode.dev/zen/v1",
        apiFormat: "openai-chat-completions",
        logoKey: "opencode",
        consoleUrl: "https://opencode.dev/zen",
        models: [
          {
            modelId: "zen-1",
            contextWindow: 400_000,
            maxOutputTokens: 64_000,
            inputTypes: ["text", "image", "pdf"],
            capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
            reasoningLevels: ["low", "medium", "high"],
          },
        ],
      },
    ],
  },
];

const ALL_TEMPLATES: ProviderTemplate[] = PROVIDER_TEMPLATE_GROUPS.flatMap((g) => g.templates);

export function getProviderTemplate(key: string): ProviderTemplate | null {
  return ALL_TEMPLATES.find((t) => t.key === key) ?? null;
}
