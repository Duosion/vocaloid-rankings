import { User } from "@/data/types"

export interface GraphQLContext {
    user: User | null
}