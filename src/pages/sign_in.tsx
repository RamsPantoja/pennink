import SignInForm from "~/components/SignIn/SignInForm";
import type { GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

type SignInProps = {
  searchParams: {
    callback_url: string;
  };
};

const SignIn = ({}: SignInProps) => {
  return (
    <div className="absolute flex h-full w-full">
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="bg-mochaMantle absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <SignInForm callbackUrl={""} />
      </div>
    </div>
  );
};

export const getServerSideProps = (async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: { session } };
}) satisfies GetServerSideProps<{ session: Session | null }>;

export default SignIn;
