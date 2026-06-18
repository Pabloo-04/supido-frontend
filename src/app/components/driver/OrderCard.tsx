import type { AvailableOrder } from "@/lib/orders";

interface OrderCardProps {
  order: AvailableOrder;
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <div
      className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h3
          className="text-white font-bold text-base"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {order.restaurantName}
        </h3>
        <span
          className="text-[0.7rem] tracking-wide uppercase
                     bg-[var(--color-suido-cat)]/20 text-[var(--color-suido-accent)]
                     border border-[var(--color-suido-cat)]/30 rounded-full px-3 py-0.5"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          #{order.id}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
        <p>
          <span className="text-[var(--color-suido-3)]">Retiro:</span> {order.pickupAddress}
        </p>
        <p>
          <span className="text-[var(--color-suido-3)]">Entrega:</span> {order.deliveryAddress}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-suido-3)]/15">
        <span className="text-white font-semibold" style={{ fontFamily: "var(--font-dm)" }}>
          ${order.total.toFixed(2)}
        </span>
        <span className="text-xs text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
