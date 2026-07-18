import { redirect } from 'next/navigation';

/**
 * The homepage is now a page-builder page. Its layout (order, show/hide) and
 * section titles are edited in the builder, so this old screen just forwards
 * there — kept as a route only so any bookmark still lands somewhere useful.
 */
export default function HomeSectionsRedirect() {
  redirect('/admin/pages/home');
}
