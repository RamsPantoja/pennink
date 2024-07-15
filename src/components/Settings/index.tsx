import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProfileEditor from "../YourBuuddy/ProfileEditor";
import ConnectPayment from "./ConnectPayment";
import useSettingsLogic from "./useSettingsLogic";

const SettingsContainer = () => {

    const { } = useSettingsLogic();

    return (
        <Card className="flex flex-col w-full gap-4 overflow-hidden">
            <h1 className="text-blackMain font-bold text-2xl">Settings</h1>
            <Tabs defaultValue="profile" className="flex flex-col items-start h-full overflow-hidden">
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
    )
}

export default SettingsContainer;