// بطاقة "تحميل" — بنفس أبعاد بطاقة المنتج بالظبط.
// الفايدة: الصفحة بتحجز مساحتها من أول لحظة، فمفيش قفز لما المنتجات توصل.
export default function ProductCardSkeleton() {
  return (
    <div className="card card-skeleton" aria-hidden="true">
      <div className="skeleton-media" />
      <div className="card-body">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="card-foot">
          <div className="skeleton-line skeleton-price" />
        </div>
      </div>
    </div>
  );
}
