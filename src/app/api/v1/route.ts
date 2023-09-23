
import { getSong } from "@/data/songsData"
import { graphql, buildSchema } from "graphql"
import { NextResponse } from "next/server"
import { Schema } from "./schema"

// define resolvers
const resolveGetSong = (
    args: {
        id: number
    }
) => {
    return getSong(args.id)
}

const rootValue = {
    Song: resolveGetSong
}

export async function GET(
    request: Request,
) {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('id') || ''

    const response = await graphql({
        schema: Schema,
        source: `
        {
            song( id: 520007 ) {
                id
                publishDate
                additionDate
                type
                thumbnail
                maxresThumbnail
                averageColor
                darkColor
                lightColor
                artists {
                    id
                    type
                    category
                    publishDate
                    additionDate
                    names {
                        original
                        japanese
                        romaji
                        english
                    }
                    averageColor
                    darkColor
                    lightColor
                }
                names {
                    original
                    japanese
                    romaji
                    english
                }
                videoIds {
                    youtube
                    niconico
                    bilibili
                }
                views {
                    timestamp,
                    total,
                    breakdown {
                        youtube {
                            id
                            views
                        }
                        niconico {
                            id
                            views
                        }
                        bilibili {
                            id
                            views
                        }
                    }
                }
                placement {
                    allTime
                    releaseYear
                }
                thumbnailType
            }
        }
        `,
        rootValue: rootValue
    })

    return NextResponse.json(response)
}