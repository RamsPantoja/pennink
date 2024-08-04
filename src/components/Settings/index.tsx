import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProfileEditor from "../YourBuuddy/ProfileEditor";
import ConnectPayment from "./ConnectPayment";
import useSettingsLogic from "./useSettingsLogic";

const SettingsContainer = () => {
  const {} = useSettingsLogic();

  return (
    <Card className="flex w-full flex-col gap-4 overflow-hidden">
      <h1 className="text-mochaText text-2xl font-bold">Settings</h1>
      <Tabs
        defaultValue="profile"
        className="flex h-full flex-col items-start overflow-hidden"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="flex overflow-hidden">
          <ProfileEditor />
        </TabsContent>
        <TabsContent value="payment">
          <ConnectPayment />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default SettingsContainer;
