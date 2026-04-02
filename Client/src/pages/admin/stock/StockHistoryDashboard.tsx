import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Modal, Select, Table, Tag, message, InputNumber } from "antd";
import { getProducts, getProduct } from "../../../services/product.service";
import { getStockHistory, adjustStock } from "../../../services/stockHistory.service";
import { Product } from "../../../types/product";
import "../products/product.css";

type HistoryItem = {
  _id: string;
  productId?: { _id?: string; name?: string };
  sku?: string;
  size?: string;
  color?: string;
  oldStock?: number;
  newStock?: number;
  change?: number;
  action?: string;
  note?: string;
  createdAt?: string;
};

type Variant = {
  _id: string;
  sku?: string;
  size?: string;
  color?: string;
  stock?: number;
};

const actionColors: Record<string, string> = {
  initial: "blue",
  update: "gold",
  added: "green",
  removed: "red",
  rent: "purple",
  adjust: "geekblue",
};

const actionLabel = (value?: string) => {
  switch (value) {
    case "initial":
      return "Khởi tạo";
    case "update":
      return "Cập nhật";
    case "added":
      return "Thêm biến thể";
    case "removed":
      return "Xóa biến thể";
    case "rent":
      return "Cho thuê";
    case "adjust":
      return "Điều chỉnh";
    default:
      return value ?? "-";
  }
};

const StockHistoryDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [products, setProducts] = useState<Product[]>([]);
  const [filterProductId, setFilterProductId] = useState<string>("");
  const [filterSku, setFilterSku] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string>("");
  const [adjustVariantId, setAdjustVariantId] = useState<string>("");
  const [adjustChange, setAdjustChange] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await getProducts({ page: 1, limit: 200 });
      const payload = res.data?.data?.products ?? res.data?.products ?? [];
      setProducts(payload as Product[]);
    } catch (error) {
      setProducts([]);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getStockHistory({
        page,
        limit,
        sku: filterSku || undefined,
        action: filterAction || undefined,
        productId: filterProductId || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      const payload = res.data?.data ?? res.data;
      setHistory(payload?.items ?? []);
      setTotal(payload?.total ?? 0);
    } catch (error) {
      setHistory([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, limit]);

  const handleApplyFilter = () => {
    setPage(1);
    fetchHistory();
  };

  const handleOpenAdjust = () => {
    setAdjustOpen(true);
  };

  const handleFetchVariants = async (productId: string) => {
    try {
      const res = await getProduct(productId);
      const data = res.data;
      const variantsData =
        data?.data?.variants ?? data?.variants ?? data?.data?.product?.variants ?? [];
      setVariants(
        Array.isArray(variantsData)
          ? variantsData.map((v: any) => ({
              _id: String(v._id ?? ""),
              sku: String(v.sku ?? ""),
              size: String(v.size ?? ""),
              color: String(v.color ?? ""),
              stock: Number(v.stock ?? 0),
            }))
          : []
      );
    } catch (error) {
      setVariants([]);
    }
  };

  const handleSubmitAdjust = async () => {
    if (!adjustVariantId || !adjustChange) {
      message.error("Chọn biến thể và số lượng điều chỉnh.");
      return;
    }
    try {
      await adjustStock({
        variantId: adjustVariantId,
        change: adjustChange,
        note: adjustNote,
      });
      message.success("Đã điều chỉnh tồn kho");
      setAdjustOpen(false);
      setAdjustProductId("");
      setAdjustVariantId("");
      setAdjustChange(0);
      setAdjustNote("");
      setVariants([]);
      fetchHistory();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || error?.message || "Lỗi điều chỉnh";
      message.error(apiMessage);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Thời gian",
        dataIndex: "createdAt",
        render: (value: string) =>
          value ? new Date(value).toLocaleString("vi-VN") : "-",
      },
      {
        title: "Sản phẩm",
        dataIndex: "productId",
        render: (product: any) => product?.name || "-",
      },
      { title: "SKU", dataIndex: "sku" },
      { title: "Size", dataIndex: "size" },
      { title: "Màu", dataIndex: "color" },
      {
        title: "Tồn cũ",
        dataIndex: "oldStock",
      },
      {
        title: "Biến động",
        dataIndex: "change",
        render: (value: number) => (
          <span className={value >= 0 ? "text-green-600" : "text-red-600"}>
            {value >= 0 ? `+${value}` : value}
          </span>
        ),
      },
      { title: "Tồn mới", dataIndex: "newStock" },
      {
        title: "Hành động",
        dataIndex: "action",
        render: (value: string) => (
          <Tag color={actionColors[value] || "default"}>{actionLabel(value)}</Tag>
        ),
      },
      { title: "Ghi chú", dataIndex: "note" },
    ],
    []
  );

  return (
    <div className="product-page">
      <div className="product-page-header">
        <div>
          <div className="product-title">Quản lý biến động tồn kho</div>
          <div className="product-subtitle">Theo dõi và điều chỉnh tồn kho</div>
        </div>
        <div className="product-toolbar">
          <Button type="primary" onClick={handleOpenAdjust}>
            Điều chỉnh tồn kho
          </Button>
        </div>
      </div>

      <Card className="product-card product-section">
        <div className="product-filter-bar">
          <Select
            allowClear
            placeholder="Chọn sản phẩm"
            value={filterProductId || undefined}
            onChange={(val) => setFilterProductId(val ?? "")}
            options={products.map((p) => ({
              value: p._id,
              label: p.name,
            }))}
            style={{ minWidth: 220 }}
          />
          <Input
            placeholder="SKU"
            value={filterSku}
            onChange={(e) => setFilterSku(e.target.value)}
            style={{ width: 160 }}
          />
          <Select
            allowClear
            placeholder="Hành động"
            value={filterAction || undefined}
            onChange={(val) => setFilterAction(val ?? "")}
            options={[
              { value: "initial", label: "Khởi tạo" },
              { value: "update", label: "Cập nhật" },
              { value: "added", label: "Thêm mới" },
              { value: "removed", label: "Xóa" },
              { value: "rent", label: "Thuê" },
              { value: "adjust", label: "Điều chỉnh" },
            ]}
            style={{ minWidth: 160 }}
          />
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
          <Button onClick={handleApplyFilter}>Lọc</Button>
        </div>
      </Card>

      <Card className="product-card product-table-card" style={{ marginTop: 16 }}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={history}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (p, size) => {
              setPage(p);
              setLimit(size ?? 10);
            },
          }}
        />
      </Card>

      <Modal
        title="Điều chỉnh tồn kho"
        open={adjustOpen}
        onCancel={() => setAdjustOpen(false)}
        onOk={handleSubmitAdjust}
      >
        <div className="space-y-3">
          <Select
            placeholder="Chọn sản phẩm"
            value={adjustProductId || undefined}
            onChange={(val) => {
              const id = String(val ?? "");
              setAdjustProductId(id);
              setAdjustVariantId("");
              setVariants([]);
              if (id) handleFetchVariants(id);
            }}
            options={products.map((p) => ({
              value: p._id,
              label: p.name,
            }))}
            style={{ width: "100%" }}
          />
          <Select
            placeholder="Chọn biến thể"
            value={adjustVariantId || undefined}
            onChange={(val) => setAdjustVariantId(String(val ?? ""))}
            options={variants.map((v) => ({
              value: v._id,
              label: `${v.size} - ${v.color} (${v.sku || "SKU"}) | tồn: ${v.stock ?? 0}`,
            }))}
            style={{ width: "100%" }}
            disabled={!adjustProductId}
          />
          <InputNumber
            placeholder="Số lượng điều chỉnh (+/-)"
            value={adjustChange}
            onChange={(val) => setAdjustChange(Number(val ?? 0))}
            style={{ width: "100%" }}
          />
          <Input
            placeholder="Ghi chú"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default StockHistoryDashboard;
