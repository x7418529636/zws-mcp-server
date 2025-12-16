import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { callSalesOrderService } from "./soap.js";

const itemSchema = z.object({
  materialNo: z.string().min(1).describe("Material number (numeric6)"),
  material: z.string().min(1).describe("Material description (char40)"),
  unit: z.string().min(1).describe("Unit (unit3)"),
  qty: z.string().min(1).describe("Quantity (up to 15.3 decimals)"),
  custMaterial: z.string().min(1).describe("Customer material (char35)"),
  plant: z.string().min(1).describe("Plant (char4)"),
  shippingPoint: z.string().min(1).describe("Shipping point (char4)"),
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Delivery date, YYYY-MM-DD"),
});

const createSalesOrderSchema = z.object({
  custPo: z.string().min(1).describe("Customer PO number (char35)"),
  custPoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("PO date, YYYY-MM-DD"),
  orderType: z.string().min(1).describe("Order type (char4)"),
  salesChannel: z.string().min(1).describe("Sales channel (char2)"),
  salesDivision: z.string().min(1).describe("Sales division (char2)"),
  salesOrg: z.string().min(1).describe("Sales org (char4)"),
  shipToParty: z.string().min(1).describe("Ship-to party (char10)"),
  soldToParty: z.string().min(1).describe("Sold-to party (char10)"),
  items: z.array(itemSchema).min(1).describe("Sales order items"),
  endpoint: z
    .string()
    .url()
    .describe("Override SOAP endpoint URL (defaults to WSDL endpoint)")
    .optional(),
  username: z
    .string()
    .describe("Override Basic Auth username (fallback to env SOAP_USERNAME)")
    .optional(),
  password: z
    .string()
    .describe("Override Basic Auth password (fallback to env SOAP_PASSWORD)")
    .optional(),
  timeoutMs: z
    .number()
    .int()
    .positive()
    .describe("Request timeout in milliseconds (default 15000)")
    .optional(),
});

const mcpServer = new McpServer({
  name: "zws-bapi-salesorder-create",
  version: "0.1.0",
});

mcpServer.registerTool(
  "createSalesOrder",
  {
    description:
      "Call the SAP ZBAPI_SALESORDER_CREATE SOAP endpoint defined in the bundled WSDL.",
    inputSchema: createSalesOrderSchema,
  },
  async (args) => {
    try {
      const username = args.username ?? process.env.SOAP_USERNAME;
      const password = args.password ?? process.env.SOAP_PASSWORD;
      const endpoint =
        args.endpoint ??
        process.env.SOAP_ENDPOINT ??
        "https://vhivcqasci.sap.inventec.com:44300/sap/bc/srt/rfc/sap/zws_bapi_salesorder_create/100/zws_bapi_salesorder_create_sev/zws_bapi_salesorder_create_binding";
      const timeoutMs = args.timeoutMs ?? Number(process.env.SOAP_TIMEOUT_MS ?? 15000);

      const { ok, status, statusText, body } = await callSalesOrderService({
        payload: {
          custPo: args.custPo,
          custPoDate: args.custPoDate,
          items: args.items,
          orderType: args.orderType,
          salesChannel: args.salesChannel,
          salesDivision: args.salesDivision,
          salesOrg: args.salesOrg,
          shipToParty: args.shipToParty,
          soldToParty: args.soldToParty,
        },
        endpoint,
        username,
        password,
        timeoutMs,
      });

      return {
        content: [
          {
            type: "text",
            text: `SOAP ${ok ? "succeeded" : "failed"} (${status} ${statusText}) against ${endpoint}`,
          },
          {
            type: "text",
            text: body,
          },
        ],
        isError: !ok,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Unexpected error: ${String(error)}`;
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch((error) => {
  // Log and exit non-zero so the client knows the server failed to start.
  console.error(error);
  process.exit(1);
});
