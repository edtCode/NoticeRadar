export const getPagination = (page, limit) => {
    const from = (page - 1) * limit;

    return {
        from,
        to: from + limit - 1
    };
};

export const buildPagination = (page, limit, total) => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    };
};
