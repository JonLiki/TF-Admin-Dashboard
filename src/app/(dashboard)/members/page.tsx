import { getMembers, getTeams } from "@/lib/queries";
import { MembersClientView } from "@/components/members/MembersClientView";

export default async function MembersPage() {
    const members = await getMembers();
    const teams = await getTeams();

    return <MembersClientView members={members} teams={teams} />;
}
