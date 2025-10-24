import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { getCalendarClient } from "./helpers";
import axios from "axios";

dotenv.config({
  quiet: true,
  path: "C:\\Users\\matek\\OneDrive\\Documents\\mcp_servers\\mcp-calendar\\.env",
});

const server = new McpServer({
  name: "calendar",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "get_events",
  "Get user's Google Calendar events",
  {
    startDate: z.string().describe("Events that start after or on this date"),
    endDate: z.string().describe("Events that start before this date"),
  },
  async ({ startDate, endDate }) => {
    const calendar = getCalendarClient();
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events =
      res.data.items?.map((event) => ({
        summary: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
      })) || [];

    return {
      content: [{ type: "text", text: JSON.stringify(events) }],
    };
  }
);

server.tool(
  "get_event",
  "Get a specific Google Calendar event",
  {
    eventId: z.string().describe("Event ID"),
  },
  async ({ eventId }) => {
    const calendar = getCalendarClient();
    const res = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    const event = {
      summary: res.data.summary,
      start: res.data.start?.dateTime || res.data.start?.date,
      end: res.data.end?.dateTime || res.data.end?.date,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(event) }],
    };
  }
);

server.tool(
  "add_event",
  "Add a new event to user's Google Calendar",
  {
    title: z.string().describe("Event title"),
    start: z.string().describe("Event start date and time"),
    end: z.string().describe("Event end date and time"),
    location: z
      .string()
      .describe("Geographic location of the event as free-form text")
      .optional(),
  },
  async ({ title, start, end, location }) => {
    const calendar = getCalendarClient();
    const event = {
      summary: title,
      start: { dateTime: start },
      end: { dateTime: end },
      location,
    };

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return {
      content: [{ type: "text", text: JSON.stringify(res.data) }],
    };
  }
);

server.tool(
  "update_event",
  "Update an event on a user's Google Calendar",
  {
    title: z.string().describe("Event title").optional(),
    start: z.string().describe("Event start date and time").optional(),
    end: z.string().describe("Event end date and time").optional(),
    eventId: z.string().describe("Event ID"),
    location: z
      .string()
      .describe("Geographic location of the event as free-form text")
      .optional(),
  },
  async ({ title, start, end, eventId, location }) => {
    const calendar = getCalendarClient();
    const event = {
      ...(title && { summary: title }),
      ...(start && { start: { dateTime: start } }),
      ...(end && { end: { dateTime: end } }),
      ...(location && { location }),
    };

    const res = await calendar.events.patch({
      eventId,
      calendarId: "primary",
      requestBody: event,
    });

    return {
      content: [{ type: "text", text: JSON.stringify(res.data) }],
    };
  }
);

server.tool(
  "delete_event",
  "Delete an event from a user's Google Calendar",
  {
    eventId: z.string().describe("Event ID"),
  },
  async ({ eventId }) => {
    const calendar = getCalendarClient();

    const res = await calendar.events.delete({
      eventId,
      calendarId: "primary",
    });

    return {
      content: [{ type: "text", text: JSON.stringify(res.data) }],
    };
  }
);

server.tool(
  "get_distance_and_time",
  "Get the distance and time between two points",
  {
    point1Coordinates: z
      .tuple([z.number(), z.number()])
      .describe("Coordinates of first point [longitude, latitude]"),
    point2Coordinates: z
      .tuple([z.number(), z.number()])
      .describe("Coordinates of second point [longitude, latitude]"),
  },
  async ({ point1Coordinates, point2Coordinates }) => {
    try {
      const url = "https://api.openrouteservice.org/v2/directions/driving-car";
      const coords = { coordinates: [point1Coordinates, point2Coordinates] };

      const res = await axios.post(url, coords, {
        headers: {
          Authorization: process.env.OPENROUTESERVICE_API_KEY,
          "Content-Type": "application/json",
        },
      });

      const summary = res.data.routes[0].summary;
      const distance = summary.distance / 1000; // in km
      const duration = summary.duration / 60; // in minutes

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                distance: `${distance.toFixed(2)} km`,
                duration: `${duration.toFixed(2)} mins`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
      console.error(
        "Error fetching distance:",
        error.response?.data || error.message
      );
      return {
        content: [
          {
            type: "text",
            text: "Error fetching distance data. Please check coordinates or API key.",
          },
        ],
      };
    }
  }
);

server.tool(
  "get_coordinates",
  "Get the coordinates of a place",
  {
    place: z.string().describe("Name of the place to get coordinates for"),
  },
  async ({ place }) => {
    try {
      const params = new URLSearchParams({
        api_key: process.env.OPENROUTESERVICE_API_KEY || "",
        text: place,
      });
      const url = "https://api.openrouteservice.org/geocode/search";
      const res = await axios.get(`${url}?${params.toString()}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              coordinates: res.data.features[0].geometry.coordinates,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error(
        "Error fetching distance:",
        error.response?.data || error.message
      );
      return {
        content: [
          {
            type: "text",
            text: "Error fetching coordinates",
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Calendar MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
