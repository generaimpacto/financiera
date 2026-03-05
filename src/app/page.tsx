import { redirect } from 'next/navigation'

export default function Home() {
  // Redirigir siempre al dashboard. En el middleware protegeremos esta ruta
  // para que si no está logueado, lo mande a /login.
  redirect('/login')
}
