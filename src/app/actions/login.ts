'use server'

import { getUserFromUsername } from "@/data/auth"
import { login } from "@/lib/auth"
import { LanguageDictionaryKey } from "@/localization"
import { cookies } from "next/dist/client/components/headers"

export interface LoginActionResponse {
    error?: LanguageDictionaryKey | string,
    success: boolean
}

export async function loginAction(
    formData: FormData
): Promise<LoginActionResponse> {
    try {
        const username = formData.get('username')
        const password = formData.get('password')
        const user = username ? await getUserFromUsername(username as string) : null
        if (!user || !password) throw new Error('login_invalid_credentials')

        await login(cookies(), user, password as string, formData.get('stayLoggedIn') as boolean | null || false)

        return {
            success: true
        }
        
    } catch (error: any) {
        if (error instanceof Error) {
            return {
                success: false,
                error: error.message as LanguageDictionaryKey
            }
        } else {
            return {
                success: false,
                error: String(error)
            }
        }
    }
}