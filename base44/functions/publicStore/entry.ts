import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = body.slug;
    if (!slug) return Response.json({ error: 'Slug requis' }, { status: 400 });

    const stores = await base44.asServiceRole.entities.Store.filter({ slug });
    if (!stores.length) return Response.json({ error: 'Boutique introuvable' }, { status: 404 });

    const store = stores[0];
    const [products, collections, discounts, articles] = await Promise.all([
      base44.asServiceRole.entities.Product.filter({ store_id: store.id, status: 'active' }, '-created_date', 100),
      base44.asServiceRole.entities.Collection.filter({ store_id: store.id, status: 'active' }, '-created_date', 50),
      base44.asServiceRole.entities.Discount.filter({ store_id: store.id, status: 'active' }, '-created_date', 20),
      base44.asServiceRole.entities.Article.filter({ store_id: store.id, status: 'published' }, '-published_at', 20),
    ]);

    return Response.json({ store, products, collections, discounts, articles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}