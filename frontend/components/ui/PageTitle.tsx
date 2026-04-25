import Container from "../Layout/Container";

interface IPageTitleProps {
  title: string;
  description?: string[];
}

export default function PageTitle({ title, description }: IPageTitleProps) {
  return (
    <section className="bg-darkbg py-8 xs:py-16">
      <Container>
        <div className="text-light">
          <p className="font-bold text-3xl xs:text-5xl">{title}</p>
          <h1 className="text-xl xs:text-2xl font-semibold mt-3 max-w-[860px]">
            {description?.map((text, idx) => <p key={idx}>{text}</p>)}
          </h1>
        </div>
      </Container>
    </section>
  );
}
