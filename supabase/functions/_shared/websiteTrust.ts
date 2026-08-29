export type WebsiteFinding = { dimension: 'performance' | 'mobile' | 'accessibility' | 'seo' | 'conversion' | 'trust' | 'content'; severity: 'critical' | 'high' | 'medium' | 'low'; title: string; evidence: string; recommendation: string; impactScore: number; effortScore: number };
export type WebsiteAudit = { score: number; findings: WebsiteFinding[]; trust: { eligible: boolean; blockers: string[]; confidence: number } };
export function buildServerWebsiteAudit(url: string, html: string, text: string): WebsiteAudit {
 const findings: WebsiteFinding[]=[];
 const hasViewport=/<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);
 const hasTitle=/<title[^>]*>[^<]{3,}<\/title>/i.test(html);
 const hasDescription=/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}["']/i.test(html);
 const hasH1=/<h1\b[^>]*>[^<]{3,}<\/h1>/i.test(html);
 const hasCta=/\b(book|booking|reserve|reservieren|kontakt|contact|quote|angebot|order|bestellen|call|anrufen|termin|appointment)\b/i.test(text);
 const hasImagesAlt=!/<img\b(?![^>]*\balt=)[^>]*>/i.test(html);
 const hasHttps=url.startsWith('https://');
 const hasForm=/<form\b/i.test(html);
 if(!hasHttps) findings.push({dimension:'trust',severity:'critical',title:'HTTPS is missing',evidence:'The supplied URL uses HTTP.',recommendation:'Serve the site over HTTPS.',impactScore:10,effortScore:2});
 if(!hasViewport) findings.push({dimension:'mobile',severity:'critical',title:'Mobile viewport is missing',evidence:'No viewport meta tag was detected.',recommendation:'Add a responsive viewport declaration.',impactScore:10,effortScore:1});
 if(!hasTitle) findings.push({dimension:'seo',severity:'high',title:'Page title is missing or weak',evidence:'No meaningful title tag was detected.',recommendation:'Add a descriptive page title.',impactScore:8,effortScore:1});
 if(!hasDescription) findings.push({dimension:'seo',severity:'medium',title:'Meta description is missing',evidence:'No usable meta description was detected.',recommendation:'Add a concise search and sharing description.',impactScore:5,effortScore:1});
 if(!hasH1) findings.push({dimension:'content',severity:'high',title:'Primary heading is missing',evidence:'No H1 heading was detected.',recommendation:'Add one clear value proposition as the H1.',impactScore:8,effortScore:2});
 if(!hasCta) findings.push({dimension:'conversion',severity:'critical',title:'Primary conversion action is unclear',evidence:'No booking, contact, quote or order intent was detected in page text.',recommendation:'Add one dominant CTA tied to the primary business outcome.',impactScore:12,effortScore:2});
 if(!hasImagesAlt) findings.push({dimension:'accessibility',severity:'high',title:'Images lack alternative text',evidence:'At least one image appears without an alt attribute.',recommendation:'Add meaningful alt text to informative images.',impactScore:7,effortScore:2});
 if(text.length<300) findings.push({dimension:'content',severity:'medium',title:'Thin readable content',evidence:`Only ${text.length} readable characters were extracted.`,recommendation:'Strengthen offer, proof, service and location content.',impactScore:5,effortScore:3});
 if(!hasForm&&!hasCta) findings.push({dimension:'conversion',severity:'high',title:'No obvious lead path',evidence:'No form or conversion action was detected.',recommendation:'Provide a low-friction contact or booking path.',impactScore:9,effortScore:3});
 const penalty=findings.reduce((sum,f)=>sum+({critical:18,high:10,medium:5,low:2}[f.severity]),0);
 const score=Math.max(0,Math.min(100,100-penalty));
 const blockers=findings.filter(f=>f.severity==='critical').map(f=>`${f.dimension}: ${f.title}`);
 return {score,findings,trust:{eligible:blockers.length===0&&score>=45,blockers,confidence:Math.min(1,0.45+Math.min(findings.length,7)*0.07)}};
}
