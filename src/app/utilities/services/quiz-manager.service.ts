import { Injectable } from '@angular/core';
export class QuizQuestion {
  constructor(
    public id: string,
    public question: string,
    public answer: string
  ) {}
  static parseJson(value: any) {
    return new QuizQuestion(value.id, value.question, value.answer);
  }
  static createNew(question: string, answer: string) {
    return new QuizQuestion(crypto.randomUUID(), question, answer);
  }
}
@Injectable({
  providedIn: 'root',
})
export class QuizManagerService {
  questionIndex: Set<string>;
  questions: QuizQuestion[];
  constructor() {
    try {
      this.loadQuestionIndex();
      this.loadQuestions(this.questionIndex);
    } catch (err) {
      console.error(err);
    }
  }
  loadQuestionIndex() {
    this.questionIndex = new Set(
      window.localStorage.getItem('index').split(',')
    );
  }
  removeQuestion(id: string) {
    this.questionIndex.delete(id);
    window.localStorage.removeItem(id);
    this.saveQuestionIndex();
  }
  saveQuestionIndex() {
    window.localStorage.setItem('index', [...this.questionIndex].join(','));
  }
  loadQuestions(questionIndex: Set<string>) {
    if (!questionIndex) {
      this.questions = null;
      throw new Error('No index supplied');
    }
    this.questions = [...questionIndex].map((q) =>
      QuizQuestion.parseJson(JSON.parse(window.localStorage.getItem(q)))
    );
  }
  saveQuestion(question: QuizQuestion) {
    if (question == null || question.id == null)
      throw new Error('invalid question saved');
    window.localStorage.setItem(question.id, JSON.stringify(question));
    this.questionIndex ||= new Set();
    this.questionIndex.add(question.id);
    this.saveQuestionIndex();
  }
}
