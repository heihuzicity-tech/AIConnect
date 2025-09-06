// 公司官方域名映射
export const companyDomains: Record<string, string> = {
  'OpenAI': 'openai.com',
  'Anthropic': 'anthropic.com',
  'Google AI': 'deepmind.google',
  'Microsoft AI': 'microsoft.com',
  'Meta AI': 'ai.meta.com',
  'xAI': 'x.ai',
  'DeepMind': 'deepmind.google',
  'Hugging Face': 'huggingface.co'
};

// 备用图标URL（用于favicon服务失败时）
const fallbackLogos: Record<string, string> = {
  'OpenAI': 'https://cdn.openai.com/API/logo-openai.svg',
  'Anthropic': 'https://www.anthropic.com/favicon.ico',
  'Google AI': 'https://www.google.com/favicon.ico',
  'Microsoft AI': 'https://www.microsoft.com/favicon.ico',
  'Meta AI': 'https://static.xx.fbcdn.net/rsrc.php/v3/yC/r/YasXbS6kJKP.png',
  'xAI': 'https://x.ai/favicon.ico',
  'DeepMind': 'https://www.google.com/favicon.ico',
  'Hugging Face': 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg'
};

/**
 * 获取公司logo，优先使用favicon服务，失败时使用备用logo
 */
export function getCompanyLogo(companyName: string): string | null {
  const domain = companyDomains[companyName];
  
  if (domain) {
    // 使用Google favicon服务获取官方图标
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }
  
  // 如果没有域名配置，尝试使用备用logo
  return fallbackLogos[companyName] || null;
}

/**
 * 获取高分辨率公司logo
 */
export function getCompanyLogoHD(companyName: string): string | null {
  const domain = companyDomains[companyName];
  
  if (domain) {
    // 使用更大尺寸的favicon
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }
  
  return fallbackLogos[companyName] || null;
}

/**
 * 为新公司动态获取logo
 */
export function getDynamicCompanyLogo(companyName: string, domain?: string): string {
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }
  
  // 如果没有提供域名，尝试猜测
  const guessedDomain = companyName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ai$/, '')
    .replace(/inc$/, '')
    .replace(/llc$/, '') + '.com';
    
  return `https://www.google.com/s2/favicons?domain=${guessedDomain}&sz=64`;
}