import {
  type GetServerSideProps,
  type InferGetServerSidePropsType,
} from "next";
import { getServerSession, type Session } from "next-auth";
import { useRouter } from "next/navigation";
import BuuddyLogotype from "~/components/common/BuuddyLogotype";
import { Card } from "~/components/ui/card";
import ProfileEditor from "~/components/YourBuuddy/ProfileEditor";
import { authOptions } from "~/server/auth";

const OnBoarding = ({}: InferGetServerSidePropsType<
  typeof getServerSideProps
>) => {
  const router = useRouter();

  const onSuccessProfileSaved = () => {
    router.push("/");
  };

  return (
    <div className="flex h-screen w-full flex-1 justify-center overflow-hidden bg-mochaBase">
      <div className="flex h-full w-full justify-center overflow-auto">
        <Card className="flex h-fit w-full max-w-screen-xl flex-col items-center gap-4">
          <Card className="flex flex-col items-center">
            <BuuddyLogotype />
            <p className="text-base font-black text-mochaText">
              Rent and Connect with People
            </p>
          </Card>
          <p className="text-3xl font-bold">Your profile</p>
          <ProfileEditor onSuccessCallback={onSuccessProfileSaved} />
        </Card>
      </div>
    </div>
  );
};

type ServerSideProps = {
  session: Session | null;
};

export const getServerSideProps = (async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/sign_in",
        permanent: false,
      },
    };
  }

  if (session.user.onBoardingCompleted) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default OnBoarding;
