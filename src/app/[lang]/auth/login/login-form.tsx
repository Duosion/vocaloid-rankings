'use client'
import { LoginActionResponse, loginAction } from "@/app/actions/login"
import { FilledButton } from "@/components/material/filled-button"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { LanguageDictionaryKey } from "@/localization"
import { ClientContext } from "graphql-hooks"
import { useRouter } from "next/navigation"
import { useContext, useState } from "react"

export function LoginForm() {
    const graphClient = useContext(ClientContext)
    const langDict = useLocale()
    const router = useRouter()

    const [error, setError] = useState(null as string | null)
    const [loading, setLoading] = useState(false)

    return (
        <form
            action={async (formData: FormData) => {
                if (loading) return
                setLoading(true)
                setError(null)
                const result: LoginActionResponse = await loginAction(formData)
                setLoading(false)

                if (result.success) {
                    graphClient?.setHeader('Authorization', `Bearer ${result.session}`)
                    return router.back()
                } 

                const error = result.error
                setError(error ? langDict[error as LanguageDictionaryKey] || error : null)
            }}
            className="flex flex-col gap-5 w-full"
        >
            {/* Username */}
            <input
                disabled={loading}
                aria-disabled={loading}
                name='username'
                type='text'
                placeholder={langDict.login_username}
                className="w-full py-2 px-4 rounded-full text-on-surface flex text-base font-normal bg-surface-container-low"
                required
            />
            {/* Password */}
            <input
                disabled={loading}
                aria-disabled={loading}
                name='password'
                type='password'
                placeholder={langDict.login_password}
                className="w-full py-2 px-4 rounded-full text-on-surface flex text-base font-normal bg-surface-container-low"
                required
            />
            {/* Stay logged in */}
            <div className="flex gap-5 text-on-background text-base font-normal">
                <input
                    id='stay-logged-in'
                    name='stayLoggedIn'
                    type="checkbox"
                />
                <label htmlFor='stay-logged-in'>{langDict.login_stay_logged_in}</label>
            </div>


            {error ? <h4 className="pl-4 text-base text-error">{error}</h4> : undefined}

            <FilledButton
                disabled={loading}
                className="w-full"
                text={langDict.login_submit}
            />
        </form>
    )
}