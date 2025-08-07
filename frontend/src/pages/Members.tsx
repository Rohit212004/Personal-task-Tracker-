import React, { useEffect, useState } from "react";
import api from "../api"; // make sure this path is correct

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  college: string;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    api.get<Member[]>("/members")
      .then((res) => {
        setMembers(res.data);
      })
      .catch((err) => {
        console.error("Error fetching members:", err);
      });
  }, []);

  return (
    <section className="Members-section">
      <h2>Mentor</h2>
      <ul>
        <li>Dominick da Costa</li>
      </ul>
      <h2>Team Members</h2>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            {member.firstName} {member.lastName} ({member.college})
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Members;
