"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
        <svg
          className="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>Loading map...</span>
      </div>
    </div>
  ),
});

interface StatsResponse {
  success: boolean;
  data: {
    byState: Record<string, number>;
    maxCount: number;
    totalLeads: number;
  };
}

// State abbreviations for Plotly choropleth
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export function StateHeatMap() {
  const [stateData, setStateData] = useState<Record<string, number>>({});
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/v1/lead/stats");
        const data: StatsResponse = await response.json();

        if (data.success) {
          setStateData(data.data.byState);
          setTotalLeads(data.data.totalLeads);
        } else {
          setError("Failed to fetch lead stats");
        }
      } catch {
        setError("Failed to fetch lead stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Prepare data for Plotly choropleth
  const plotData = useMemo(() => {
    // Get all states with their counts (0 for states with no leads)
    const allStates = Object.keys(STATE_NAMES);
    const locations: string[] = [];
    const z: number[] = [];
    const text: string[] = [];

    for (const state of allStates) {
      const count = stateData[state] || 0;
      locations.push(state);
      z.push(count);
      text.push(`${STATE_NAMES[state]}: ${count} lead${count !== 1 ? "s" : ""}`);
    }

    return { locations, z, text };
  }, [stateData]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading lead statistics...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Leads by State
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {totalLeads} total lead{totalLeads !== 1 ? "s" : ""} across{" "}
          {Object.keys(stateData).length} state
          {Object.keys(stateData).length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="p-2">
        <Plot
          data={[
            {
              type: "choropleth",
              locationmode: "USA-states",
              locations: plotData.locations,
              z: plotData.z,
              text: plotData.text,
              hoverinfo: "text",
              colorscale: [
                [0, "#f4f4f5"], // zinc-100 (gray for 0)
                [0.01, "#dcfce7"], // green-100
                [0.25, "#86efac"], // green-300
                [0.5, "#22c55e"], // green-500
                [0.75, "#16a34a"], // green-600
                [1, "#14532d"], // green-900 (dark green)
              ],
              colorbar: {
                title: {
                  text: "Leads",
                  font: { size: 12, color: "#71717a" },
                },
                tickfont: { size: 10, color: "#71717a" },
                thickness: 15,
                len: 0.6,
              },
              marker: {
                line: {
                  color: "#a1a1aa", // zinc-400 border
                  width: 0.5,
                },
              },
            },
          ]}
          layout={{
            geo: {
              scope: "usa",
              showlakes: false,
              bgcolor: "rgba(0,0,0,0)",
              lakecolor: "rgba(0,0,0,0)",
            },
            margin: { t: 10, b: 10, l: 10, r: 10 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            dragmode: false,
          }}
          config={{
            displayModeBar: false,
            responsive: true,
          }}
          style={{ width: "100%", height: "400px" }}
        />
      </div>
    </Card>
  );
}
