# Custom domain setup

Domain: `embryoexplorer.com` (Namecheap).
Site: `appgprj_6adc213e00648191bd94ded6eda01195`.

Status: all seven DNS records saved and verified. Root and www domains are active with active TLS certificates. Both were verified in the browser on October 24, 2026.

In Namecheap Advanced DNS, replace the default root URL redirect and www parking CNAME with these host records. Keep unrelated mail records unchanged. Use Automatic TTL.

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 162.159.143.30 |
| A | @ | 172.66.3.26 |
| CNAME | www | custom-domains.chatgpt.site. |
| TXT | _openai-site-verification | openai-site-verification=_zLjaSiLYDvFA7s-JCox-eWIdt7KzWClOepcCfaivkQ |
| TXT | _cf-custom-hostname | 65bff2aa-0c07-46f8-a9ba-e04f7d1ae063 |
| TXT | _openai-site-verification.www | openai-site-verification=lT2KfG9JF2s4R5fTWOx2AyWETDaEMdVsuw8fg_Y-9Gk |
| TXT | _cf-custom-hostname.www | 439d2674-7bf0-4d49-b86e-db5a75fb0425 |

These TXT values are public DNS verification records, not login credentials. After setting them, refresh the custom-domain statuses in Sites and verify HTTPS at both hostnames.

Custom-domain IDs:
- Root: `appgdom_6adcdf0c46888191ab2947f1700651ad`
- www: `appgdom_6adcdf8b2b1c81919aefdd033d1b4d24`
