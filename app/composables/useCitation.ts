interface CitationComposable {
    initials: (author: Author) => string
    fullTitle: (pub: Publication) => string
    toIeee: (pub: Publication) => string
    toBibtex: (pub: Publication) => string
}

export const useCitation = (): CitationComposable => {
    // "Joshua Peter" -> "J. P."
    const initials = (author: Author): string =>
        (author.first_name ?? '')
            .split(/[\s-]+/)
            .filter(Boolean)
            .map((n: string) => `${n[0]}.`)
            .join(' ')

    const shortName = (author: Author): string =>
        [initials(author), author.prefix, author.last_name].filter(Boolean).join(' ')

    const fullTitle = (pub: Publication): string =>
        [pub.title, pub.subtitle].filter(Boolean).join(': ')

    // IEEE: "A, B, and C"
    const ieeeAuthors = (authors: Author[]): string => {
        const names = authors.map(shortName)
        if (names.length <= 2) return names.join(' and ')
        return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
    }

    // conference names are stored like "The 2nd International ... Conference (GACLM 2025)"
    const venueName = (pub: Publication): string =>
        (pub.journal || pub.conference || '').replace(/^the\s+/i, '')

    const toIeee = (pub: Publication): string => {
        const parts: string[] = []
        const authors = pub.authors?.length ? `${ieeeAuthors(pub.authors)}, ` : ''
        parts.push(`${authors}“${fullTitle(pub)},”`)

        const details: string[] = []
        if (pub.journal) {
            details.push(pub.journal)
        } else if (pub.conference) {
            details.push(`in Proc. ${venueName(pub)}`)
            if (pub.location) details.push(pub.location)
        }
        if (pub.year) details.push(pub.year)

        let citation = `${parts.join(' ')} ${details.join(', ')}`
        if (pub.identifier?.type === 'DOI' && pub.identifier.value) {
            citation += `, doi: ${pub.identifier.value}`
        }
        return `${citation.trim()}.`
    }

    const bibtexKey = (pub: Publication): string => {
        const lastName = (pub.authors?.[0]?.last_name ?? 'anonymous').toLowerCase().replace(/[^a-z]/g, '')
        const firstWord = (pub.title ?? '')
            .toLowerCase()
            .split(/\s+/)
            .map(w => w.replace(/[^a-z0-9]/g, ''))
            .find(w => w.length > 3) ?? ''
        return `${lastName}${pub.year ?? ''}${firstWord}`
    }

    const toBibtex = (pub: Publication): string => {
        const isArticle = !!pub.journal
        const fields: Array<[string, string | null | undefined]> = [
            ['author', pub.authors?.map(a => `${[a.prefix, a.last_name].filter(Boolean).join(' ')}, ${a.first_name ?? ''}`.trim()).join(' and ')],
            ['title', fullTitle(pub)],
            [isArticle ? 'journal' : 'booktitle', isArticle ? pub.journal : venueName(pub)],
            ['address', isArticle ? null : pub.location],
            ['publisher', pub.publisher],
            ['year', pub.year],
            ['doi', pub.identifier?.type === 'DOI' ? pub.identifier.value : null],
            ['url', pub.url],
        ]
        const body = fields
            .filter(([, value]) => value)
            .map(([key, value]) => `  ${key.padEnd(9)} = {${value}}`)
            .join(',\n')
        return `@${isArticle ? 'article' : 'inproceedings'}{${bibtexKey(pub)},\n${body}\n}`
    }

    return { initials, fullTitle, toIeee, toBibtex }
}
