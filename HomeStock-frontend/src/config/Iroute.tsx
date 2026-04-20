export default interface IRoute {
    path: string[];
    name: string;
    component: React.ComponentType<any>;
    exact?: boolean;
    children?: IRoute[]; 
    props?: any;
}