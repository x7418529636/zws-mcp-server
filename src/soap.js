const DEFAULT_ENDPOINT =
  "https://vhivcqasci.sap.inventec.com:44300/sap/bc/srt/rfc/sap/zws_bapi_salesorder_create/100/zws_bapi_salesorder_create_sev/zws_bapi_salesorder_create_binding";

const SOAP_ACTION =
  "urn:sap-com:document:sap:rfc:functions:ZWS_BAPI_SALESORDER_CREATE:ZBAPI_SALESORDER_CREATERequest";

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const buildItemsXml = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return items
    .map((item) => {
      const required = [
        "materialNo",
        "material",
        "unit",
        "qty",
        "custMaterial",
        "plant",
        "shippingPoint",
        "deliveryDate",
      ];

      const missing = required.filter(
        (key) => item[key] === undefined || item[key] === null,
      );

      if (missing.length) {
        throw new Error(
          `Item is missing required fields: ${missing.join(", ")}`,
        );
      }

      return `
        <item>
          <MATERIAL_NO>${escapeXml(item.materialNo)}</MATERIAL_NO>
          <MATERIAL>${escapeXml(item.material)}</MATERIAL>
          <UNIT>${escapeXml(item.unit)}</UNIT>
          <QTY>${escapeXml(item.qty)}</QTY>
          <CUST_MATERIAL>${escapeXml(item.custMaterial)}</CUST_MATERIAL>
          <PLANT>${escapeXml(item.plant)}</PLANT>
          <SHIPPING_POINT>${escapeXml(item.shippingPoint)}</SHIPPING_POINT>
          <DELIVERY_DATE>${escapeXml(item.deliveryDate)}</DELIVERY_DATE>
        </item>
      `.trim();
    })
    .join("");
};

export const buildSalesOrderEnvelope = (payload) => {
  const required = [
    "custPo",
    "custPoDate",
    "orderType",
    "salesChannel",
    "salesDivision",
    "salesOrg",
    "shipToParty",
    "soldToParty",
  ];

  const missing = required.filter(
    (key) => payload[key] === undefined || payload[key] === null,
  );
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  const itemsXml = buildItemsXml(payload.items);

  return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZBAPI_SALESORDER_CREATE>
          <CUST_PO>${escapeXml(payload.custPo)}</CUST_PO>
          <CUST_PO_DATE>${escapeXml(payload.custPoDate)}</CUST_PO_DATE>
          <IT_SO_ITEM>${itemsXml}</IT_SO_ITEM>
          <ORDER_TYPE>${escapeXml(payload.orderType)}</ORDER_TYPE>
          <SALES_CHANNEL>${escapeXml(payload.salesChannel)}</SALES_CHANNEL>
          <SALES_DIVISION>${escapeXml(payload.salesDivision)}</SALES_DIVISION>
          <SALES_ORG>${escapeXml(payload.salesOrg)}</SALES_ORG>
          <SHIP_TO_PARTY>${escapeXml(payload.shipToParty)}</SHIP_TO_PARTY>
          <SOLD_TO_PARTY>${escapeXml(payload.soldToParty)}</SOLD_TO_PARTY>
        </urn:ZBAPI_SALESORDER_CREATE>
      </soapenv:Body>
    </soapenv:Envelope>
  `.trim();
};

export const callSalesOrderService = async ({
  payload,
  endpoint = DEFAULT_ENDPOINT,
  username,
  password,
  timeoutMs = 15000,
}) => {
  if (!endpoint) {
    throw new Error("SOAP endpoint URL is required");
  }

  if (!username || !password) {
    throw new Error("SOAP basic auth username/password are required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const envelope = buildSalesOrderEnvelope(payload);
    const response = await fetch(endpoint, {
      method: "POST",
      body: envelope,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: SOAP_ACTION,
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      },
      signal: controller.signal,
    });

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
    };
  } finally {
    clearTimeout(timeout);
  }
};
