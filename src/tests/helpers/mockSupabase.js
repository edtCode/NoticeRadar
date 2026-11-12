const createBuilder = (client, table) => {
    const record = {
        table,
        method: "select",
        filters: [],
        orders: [],
        range: null,
        payload: undefined,
        columns: undefined,
        options: undefined,
        single: false
    };

    client.calls.push(record);

    const builder = {};

    builder.select = (columns, options) => {
        record.columns = columns;
        record.options = options;
        return builder;
    };

    builder.insert = (payload) => {
        record.method = "insert";
        record.payload = payload;
        return builder;
    };

    builder.update = (payload) => {
        record.method = "update";
        record.payload = payload;
        return builder;
    };

    builder.upsert = (payload, options) => {
        record.method = "upsert";
        record.payload = payload;
        record.options = options;
        return builder;
    };

    builder.delete = (options) => {
        record.method = "delete";
        record.options = options;
        return builder;
    };

    builder.eq = (column, value) => {
        record.filters.push({ column, op: "eq", value });
        return builder;
    };

    builder.neq = (column, value) => {
        record.filters.push({ column, op: "neq", value });
        return builder;
    };

    builder.gte = (column, value) => {
        record.filters.push({ column, op: "gte", value });
        return builder;
    };

    builder.lte = (column, value) => {
        record.filters.push({ column, op: "lte", value });
        return builder;
    };

    builder.gt = (column, value) => {
        record.filters.push({ column, op: "gt", value });
        return builder;
    };

    builder.is = (column, value) => {
        record.filters.push({ column, op: "is", value });
        return builder;
    };

    builder.or = (expression) => {
        record.filters.push({ column: "or", op: "or", value: expression });
        return builder;
    };

    builder.ilike = (column, value) => {
        record.filters.push({ column, op: "ilike", value });
        return builder;
    };

    builder.in = (column, value) => {
        record.filters.push({ column, op: "in", value });
        return builder;
    };

    builder.order = (column, options) => {
        record.orders.push({ column, options });
        return builder;
    };

    builder.range = (from, to) => {
        record.range = { from, to };
        return builder;
    };

    builder.limit = (count) => {
        record.limit = count;
        return builder;
    };

    const execute = async () => {
        const tableConfig = client.tables[record.table] ?? {};
        const response = tableConfig[record.method] ?? {};
        const value = typeof response === "function" ? await response(record) : response;

        return {
            data: null,
            error: null,
            count: null,
            ...value
        };
    };

    builder.single = () => execute();
    builder.maybeSingle = () => execute();
    builder.then = (resolve, reject) => execute().then(resolve, reject);

    return builder;
};

const createStorageApi = (client) => {
    return {
        from: (bucket) => {
            const record = { type: "storage", bucket };
            client.calls.push(record);

            return {
                upload: async (filePath, buffer, options) => {
                    record.action = "upload";
                    record.filePath = filePath;
                    record.options = options;
                    record.size = buffer?.length;

                    return client.storageResponses.upload ?? { data: { path: filePath }, error: null };
                },
                remove: async (paths) => {
                    record.action = "remove";
                    record.paths = paths;

                    return client.storageResponses.remove ?? { data: paths, error: null };
                },
                download: async (filePath) => {
                    record.action = "download";
                    record.filePath = filePath;

                    return client.storageResponses.download ?? {
                        data: null,
                        error: { message: "not configured" }
                    };
                },
                createSignedUrl: async (filePath, expiresIn) => {
                    record.action = "createSignedUrl";
                    record.filePath = filePath;
                    record.expiresIn = expiresIn;

                    return client.storageResponses.createSignedUrl ?? {
                        data: { signedUrl: `https://storage.example/${filePath}?token=test` },
                        error: null
                    };
                }
            };
        }
    };
};const createRpc = (client, fn, params) => {
  const record = { type: "rpc", function: fn, params };
  client.calls.push(record);

  const execute = async () => {
    const handler = client.rpcResponses[fn];
    const value = typeof handler === "function" ? await handler(record) : handler;

    return {
      data: null,
      error: null,
      ...value
    };
  };

  return { then: (resolve, reject) => execute().then(resolve, reject) };
};

export const createMockSupabase = ({ tables = {}, auth = {}, storage = {}, rpc = {} } = {}) => {
  const calls = [];

  const client = {
    tables,
    calls,
    storageResponses: storage,
    rpcResponses: rpc,
    auth,
    from: (table) => createBuilder(client, table),
    rpc: (fn, params) => createRpc(client, fn, params)
  };

    client.storage = createStorageApi(client);

    return client;
};
