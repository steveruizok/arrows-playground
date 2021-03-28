import { GetServerSideProps } from "next"
import React from "react"
import dynamic from "next/dynamic"

const App = dynamic<{ count: number }>(
  () => import("../../components/pixi-app"),
  {
    ssr: false,
  }
)

export default function Home({ count }: { count: number }) {
  return <App count={count} />
}

export const getServerSideProps: GetServerSideProps = async (
  context
): Promise<{ props: { count: number } }> => {
  const {
    params: { count },
  } = context

  return {
    props: {
      count: Array.isArray(count) ? parseInt(count[0]) : parseInt(count),
    },
  }
}
