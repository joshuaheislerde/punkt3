export interface Landing {
    id: string | number;
    status: 'draft' | 'published' | 'archived';
    date_updated: string | null;
    initials: string | null;
    my_name: string | null;
    image: string | null;
    opening_line_mode: 'custom' | 'current_stages' | 'full_name' | null; // 'current_stages' builds the opening line from the ongoing CV stages, 'full_name' shows my_name
    menu_items: MenuItem[];
    translations: LandingTranslation[];
}

export interface LandingTranslation {
    languages_code: string;
    about_me_short: string | null;
    opening_line: string | null;
    seo: {
        title: string | null;
        meta_description: string | null;
        keywords: string | null;
        no_index: boolean;
        no_follow: boolean;
        og_image: string | null;
    }
}