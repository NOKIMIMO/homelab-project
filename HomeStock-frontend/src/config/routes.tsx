import MissingPage from "../page/generic/404";
import ImagesDisplayer from "../page/Images/ImagesDisplayer";
import MoodBoardDisplayer from "../page/Images/MoodBoardDisplayer";
import type IRoute from "./Iroute";

const routes: IRoute[] = [
    {
        path: ['/', '/photos'],
        name: 'Gallery',
        component: ImagesDisplayer,
        exact: true,
    },
    {
        path: ['/boards'],
        name: 'Mood Board',
        component: MoodBoardDisplayer,
        exact: true,
    },
    {
        path:['*'],
        name: 'NotFound',
        component: MissingPage,
        exact: false,
    },
];

export default routes;