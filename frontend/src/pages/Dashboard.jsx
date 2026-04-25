import CreateNote from "../components/CreateNote";
import Layout from "../components/Layout";
import NotesGrid from "../components/NotesGrid";

export default function Dashboard() {
  return (
    <Layout>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <CreateNote />
        <NotesGrid />
      </section>
    </Layout>
  );
}
