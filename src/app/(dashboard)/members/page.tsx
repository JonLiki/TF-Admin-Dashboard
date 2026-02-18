import { getMembers, getTeams } from "@/actions";
import { MembersClientView } from "@/components/members/MembersClientView";

export default async function MembersPage() {
    const members = await getMembers();
    const teams = await getTeams();

    return <MembersClientView members={members} teams={teams} />;
}
