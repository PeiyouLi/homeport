// homeport · FlClash 覆写脚本（FlClash ≥ 0.8.85）
//
// 作用：Claude、Google、支付和风控相关域名统一走住宅出口 🏠住宅出口-勿选。
// 链路：本机 → HP_Relay（机场节点，自动测速）→ 🏠住宅出口-勿选（住宅 HTTP 代理）→ 目标站点。
//
// 使用前把下面 HOME 里的 server / port / username / password 换成自己的住宅代理。
// 改完以后别再从 URL 重新导入，否则会被占位符覆盖。
// 中转节点筛选规则见 RELAY_FILTER；所有中转都不能用时，把 dialer-proxy 改成 "DIRECT"
// 并删掉 HP_Relay 这一组。

const HOME = {
  server: "<HOST>",
  port: 0,
  username: "<USERNAME>",
  password: "<PASSWORD>",
};

const EXIT = "🏠住宅出口-勿选";
const RELAY = "HP_Relay";
const RELAY_FILTER = "(?i)(台湾|台灣|日本|新加坡|美国|美國|韩国|韓國|\\b(TW|JP|SG|US|KR)\\b)";
const RELAY_EXCLUDE = "(?i)倍率|IPv6|到期|剩余|官网|失联|故障|香港|\\bHK\\b";

const SUFFIX = [
  // Claude / Anthropic
  "claude.ai", "claude.com", "clau.de", "anthropic.com",
  "claudeusercontent.com", "claudemcpcontent.com", "modelcontextprotocol.io",
  "ant.dev", "antspace.dev",
  // OpenAI / ChatGPT
  "ai.com", "api.statsig.com", "auth0.com",
  "chatgpt.com", "chatgpt.livekit.cloud", "client-api.arkoselabs.com",
  "featuregates.org", "host.livekit.cloud", "identrust.com",
  "launchdarkly.com", "oaistatic.com", "oaiusercontent.com",
  "observeit.net", "turn.livekit.cloud",
  "chat.com", "livekit.cloud", "sora.com",
  // 监控 / 风控 / 验证 / 支付
  "sentry.io", "datadoghq.com", "growthbook.io", "usefathom.com", "segment.io",
  "siftscience.com", "hcaptcha.com", "challenges.cloudflare.com",
  "intercom.io", "intercomcdn.com", "intercomassets.com", "intercom-messenger.com",
  "stripe.com", "stripe.network", "stripecdn.com", "withpersona.com",
  "yoti.com", "statsigapi.net",
  // Google（含 Gmail、Google Pay）
  "google.com", "googleapis.com", "gstatic.com", "googleusercontent.com",
  "gmail.com", "recaptcha.net",
  "ai.google.dev", "antigravity.google", "antigravity-unleash.goog",
  "deepmind.com", "deepmind.google", "generativeai.google",
  "labs.google", "notebooklm.google",
  // 出口 IP 检测
  "webshare.io", "ipinfo.io",
];

const KEYWORD = ["anthropic", "claude", "browser-intake", "openai"];

const PROCESS = [
  "com.anthropic.claude",                 // Claude 安卓 App
  "com.android.vending",                  // Google Play
  "com.google.android.apps.walletnfcrel", // Google Wallet
];

const main = (config) => {
  config.proxies = config.proxies || [];
  config.proxies.push({
    name: EXIT,
    type: "http",
    ...HOME,
    "dialer-proxy": RELAY,
    // "dialer-proxy": "DIRECT",
  });

  config["proxy-groups"] = config["proxy-groups"] || [];
  config["proxy-groups"].push({
    name: RELAY,
    type: "url-test",
    hidden: true,
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 50,
    lazy: false,
    "include-all": true,
    filter: RELAY_FILTER,
    "exclude-filter": RELAY_EXCLUDE,
  });

  const rules = [
    // Anthropic IPv6 段经住宅代理会 502，先拒掉，客户端会自动回落 IPv4
    "IP-CIDR6,2607:6bc0::/48,REJECT,no-resolve",
    "IP-CIDR6,2607:6bc0:11::/48,REJECT,no-resolve",
    ...SUFFIX.map((d) => `DOMAIN-SUFFIX,${d},${EXIT}`),
    ...KEYWORD.map((k) => `DOMAIN-KEYWORD,${k},${EXIT}`),
    `IP-CIDR,34.8.0.0/16,${EXIT},no-resolve`,
    `IP-CIDR,153.61.208.0/20,${EXIT},no-resolve`,
    `IP-CIDR,153.61.224.0/22,${EXIT},no-resolve`,
    `IP-CIDR,160.79.104.0/21,${EXIT},no-resolve`,
    `IP-ASN,399358,${EXIT},no-resolve`,
    `IP-CIDR,24.199.123.28/32,${EXIT},no-resolve`,
    `IP-CIDR,64.23.132.171/32,${EXIT},no-resolve`,
    ...PROCESS.map((p) => `PROCESS-NAME,${p},${EXIT}`),
  ];
  config.rules = rules.concat(config.rules || []);
  return config;
};
