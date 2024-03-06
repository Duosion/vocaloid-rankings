import { Divider } from "@/components/material/divider";
import { UserAccessLevel } from "@/data/types";
import { getActiveSession, getAuthenticatedUser } from "@/lib/auth";
import { Locale, getDictionary } from "@/localization";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ListEditor } from "../list-editor";

export default async function NewListPage(
    {
        params
    }: {
        params: {
            lang: Locale
        }
    }
) {
    // ensure that this page can be accessed by the active session
    const user = await getAuthenticatedUser(cookies())

    if (!user || UserAccessLevel.EDITOR > user.accessLevel) return redirect('./')

    // get language dictionary
    const langDict = await getDictionary(params.lang)

    return (
        <ListEditor/>
    )

}