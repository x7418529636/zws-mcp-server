# zws-mcp-server

MCP server that proxies the SAP `ZBAPI_SALESORDER_CREATE` SOAP endpoint defined in `zws_bapi_salesorder_create_binding.xml`.

## Setup
- Install dependencies: `npm install`
- Configure auth: set `SOAP_USERNAME` and `SOAP_PASSWORD` (Basic Auth). Optional overrides: `SOAP_ENDPOINT`, `SOAP_TIMEOUT_MS`.

## Run
- Start the server on stdio: `npm start`
- The MCP tool exposed: `createSalesOrder`

## Tool arguments
```json
{
  "custPo": "PO-123",
  "custPoDate": "2024-12-30",
  "orderType": "ZOR",
  "salesChannel": "01",
  "salesDivision": "01",
  "salesOrg": "1000",
  "shipToParty": "0000001000",
  "soldToParty": "0000001000",
  "items": [
    {
      "materialNo": "000001",
      "material": "Widget",
      "unit": "EA",
      "qty": "1.000",
      "custMaterial": "CUSTMAT",
      "plant": "1000",
      "shippingPoint": "1000",
      "deliveryDate": "2024-12-31"
    }
  ]
}
```

The tool returns the SOAP response body and HTTP status. Adjust `endpoint`, `username`, `password`, or `timeoutMs` per call if needed.
