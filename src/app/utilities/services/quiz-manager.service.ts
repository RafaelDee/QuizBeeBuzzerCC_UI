import { Injectable } from '@angular/core';
export class QuizQuestion {
  constructor(public id: string, public question: string, answer: string) {}
  static parseJson(value: any) {
    return new QuizQuestion(value.id, value.question, value.answer);
  }
}
@Injectable({
  providedIn: 'root',
})
export class QuizManagerService {
  questionIndex: string[];
  questions: QuizQuestion[];
  constructor() {
    this.loadQuestionIndex();
    this.loadQuestions(this.questionIndex);
  }
  loadQuestionIndex() {
    this.questionIndex = window.localStorage.getItem('index')?.split(',');
  }
  saveQuestionIndex(id: string) {
    this.questionIndex.push(id);
    window.localStorage.setItem('index', this.questionIndex.join(','));
  }
  loadQuestions(questionIndex: string[]) {
    if(!questionIndex){
      this.questions = null;
      throw new Error("No index supplied")
    }
    this.questions = questionIndex.map((q) =>
      QuizQuestion.parseJson(JSON.parse(window.localStorage.getItem(q)))
    );
  }
  saveQuestion(question: string, answer: string) {
    const id = crypto.randomUUID();
    window.localStorage.setItem(
      id,
      JSON.stringify(new QuizQuestion(id, question, answer))
    );
    this.saveQuestionIndex(id);
  }
}
