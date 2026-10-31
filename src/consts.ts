export const NICKNAME = "Alkaid";
export const SITE_TITLE = "Alkaid's Blog";
export const SITE_DESCRIPTION = "Welcome to my blog!";

interface SocialLink {
    href: string;
    label: string;
    icon: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
    {
        href: "https://github.com/alkaid114",
        label: "GitHub",
        icon: "simple-icons:github"
    },
    {
        href: "https://space.bilibili.com/143695527",
        label: "BiliBili",
        icon: "fa6-brands:bilibili"
    }
]