import MissingPage from "@pages/generic/404";
import ImagesDisplayer from "@pages/Images/ImagesDisplayer";
import MoodBoardDisplayer from "@pages/Images/MoodBoardDisplayer";
import BoardEditor from "@components/images/boards/BoardEditor";
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
        children: [
            {
                path: [':id'],
                name: 'Board Editor',
                component: BoardEditor,
                exact: true,
            }
        ],
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