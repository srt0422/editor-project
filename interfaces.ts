import {Node} from "slate";

export interface INote {
  id: string;
  title: string;
  content: Node[];
}