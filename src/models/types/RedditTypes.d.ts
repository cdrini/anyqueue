interface RedditItem {
  kind: string;
}

interface RedditListing<T extends RedditItem> extends RedditItem {
  kind: 'Listing'
  data: {
    modhash: string
    after: string
    before: string
    children: T[]
    dist: number
  }
}

interface Oembed {
  type: string
  version: string
  provider_name: string
  provider_url: string

  title: string
  description?: string

  height: number
  width: number
  html: string

  thumbnail_url: string
  thumbnail_height: number
  thumbnail_width: number
}

interface RedditPost extends RedditItem {
  kind: 't3'
  data: {
    url: string
    permalink: string
    /** @example "t3_qkxd0l" */
    name: string

    subreddit: string
    /** @example "r/Songwriting" */
    subreddit_name_prefixed: string

    hide_score: boolean
    hidden: boolean

    ups: number
    downs: number
    upvote_ratio: number

    title: string
    selftext: string
    selftext_html: string

    /** Username */
    author: string

    secure_media?:
    {
      type: 'youtube.com',
      oembed: Oembed & {
        type: "video"
        provider_name: 'YouTube'
        provider_url: 'https://www.youtube.com/'
      }
    }
    |
    {
      type: 'm.youtube.com',
      oembed: Oembed & {
        type: "video"
        provider_name: 'YouTube'
        provider_url: 'https://www.youtube.com/'
        url: string
      }
    }
    | {
      type: 'soundcloud.com',
      oembed: Oembed & {
        type: "rich"
        provider_name: 'SoundCloud'
        provider_url: 'https://soundcloud.com/'
        description: string
      }
    }
    | {
      type: 'audiomack.com',
      oembed: Oembed & {
        type: "rich"
        provider_name: 'Audiomack'
        provider_url: 'https://audiomack.com/'
        description: string
        url: string
      }
    }
    | {
      reddit_video: {
        /** Link to .mp4 file without audio */
        fallback_url: string
        height: number
        width: number
        scrubber_media_url: string
        dash_url: string
        /** In seconds */
        duration: number
        hls_url: string
        is_gif: boolean
        transcoding_status: string
      }
    }
  }
}

interface RedditComment extends RedditItem {
  kind: 't1'
  data: {
    permalink: string
    author: string

    title: string
    body: string
    body_html: string

    replies: RedditListing<RedditComment>
  }
}
