import { useEffect, useState } from "react";
import { fetchDailyProblem, fetchProblemStats, fetchProblemByOrderNum } from "../../api/problems";

/**
 * Fetches today's daily problem, along with previous and next daily problems.
 * The new API response includes `currentProblem`, `prevProblem`, and `nextProblem`.
 */
export default function useDailyProblem({ enabled }) {
  const [data, setData] = useState(null); // { currentProblem, prevProblem, nextProblem }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const dailyProblemResponse = await fetchDailyProblem();
        if (!alive) return;

        // Extract prevProblem and nextProblem directly from the response
        const prevProblem = dailyProblemResponse.prevProblem;
        const nextProblem = dailyProblemResponse.nextProblem;

        // Construct rawDailyProblem from the remaining top-level properties
        const rawDailyProblem = {
          id: dailyProblemResponse.problemId, // Assuming problemId is the ID
          orderNum: dailyProblemResponse.orderNum,
          title: dailyProblemResponse.title,
          description: dailyProblemResponse.description,
          status: dailyProblemResponse.status,
          date: dailyProblemResponse.date,
          level: dailyProblemResponse.level,
          remainingAttempts: dailyProblemResponse.remainingAttempts,
        };

        // If there is a current problem (based on orderNum presence), fetch its full details.
        if (rawDailyProblem.orderNum) { // Check for orderNum to confirm a valid current problem
          const orderNum = rawDailyProblem.orderNum;
          const [fullProblemDetails, stats] = await Promise.all([
            fetchProblemByOrderNum(orderNum),
            fetchProblemStats(orderNum),
          ]);
          if (!alive) return;

          // Combine all details for the current problem
          const currentProblem = {
            id: fullProblemDetails.id,
            orderNum: fullProblemDetails.orderNum,
            title: fullProblemDetails.title,
            level: fullProblemDetails.level,
            description: fullProblemDetails.description,
            status: rawDailyProblem.status,
            date: rawDailyProblem.date,
            remainingAttempts: rawDailyProblem.remainingAttempts,
            stats: stats,
          };
          
          // Set the final data structure with the detailed current problem
          setData({ currentProblem, prevProblem, nextProblem });
        } else {
          // If there is no current problem (e.g., orderNum is missing), set currentProblem to null.
          // The UI component will handle the rendering for this case.
          setData({ currentProblem: null, prevProblem, nextProblem });
        }

      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [enabled]);

  return { data, loading, error };
}

