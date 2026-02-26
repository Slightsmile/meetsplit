import { UserAvailability } from "@/types/firebase";

export interface DateScore {
    date: string;         // "YYYY-MM-DD"
    availableCount: number;
    availableUsers: string[]; // List of userIds who said yes
    missingUsers: string[];   // List of userIds who said no or didn't answer
}

export function calculateBestDates(
    availabilities: UserAvailability[],
    allRoomMemberIds: string[]
): DateScore[] {
    const dateMap: Record<string, DateScore> = {};

    // 1. Tally up availability for every date mentioned by anyone
    availabilities.forEach(userDocs => {
        Object.entries(userDocs.dates).forEach(([dateString, data]) => {
            if (data.isAvailable) {
                if (!dateMap[dateString]) {
                    dateMap[dateString] = {
                        date: dateString,
                        availableCount: 0,
                        availableUsers: [],
                        missingUsers: [...allRoomMemberIds] // Start by assuming everyone is missing
                    };
                }

                // Add user to available list
                dateMap[dateString].availableCount += 1;
                dateMap[dateString].availableUsers.push(userDocs.userId);

                // Remove user from missing list
                dateMap[dateString].missingUsers = dateMap[dateString].missingUsers.filter(
                    id => id !== userDocs.userId
                );
            }
        });
    });

    // 2. Convert to array and sort by most available users (descending), 
    // then chronologically (ascending)
    const sortedDates = Object.values(dateMap).sort((a, b) => {
        if (b.availableCount !== a.availableCount) {
            return b.availableCount - a.availableCount; // Highest count first
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime(); // Earlier date first
    });

    return sortedDates;
}
